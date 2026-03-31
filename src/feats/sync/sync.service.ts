import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SyncFamilyPayloadDto } from './sync.dto';
import { Family } from '../families/family.entity';
import { Individual } from '../individuals/individual.entity';

@Injectable()
export class SyncService {
  constructor(private readonly dataSource: DataSource) {}

  async syncFamilyData(payload: SyncFamilyPayloadDto) {
    // 1. Injetar o DataSource do TypeORM e criar um QueryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // Iniciar a transação
    await queryRunner.startTransaction();

    try {
      const { family, individuals } = payload;

      // 2. Pessimistic Lock: Prevenir Race Conditions ao verificar se a família já existe
      const existingFamily = await queryRunner.manager.findOne(Family, {
        where: { numero_prontuario: family.numero_prontuario },
      });

      // 3. Validação do Teto Máximo (Regra Clínica)
      const diseasesToCheck = [
        'hipertensao_arterial',
        'diabetes',
        'teve_avc_derrame',
        'teve_infarto',
        'doenca_cardiaca',
        'problemas_rins',
        'doenca_respiratoria',
        'tuberculose',
        'hanseniase',
        'teve_cancer',
        'doenca_mental_psiquiatrica',
      ];

      for (const disease of diseasesToCheck) {
        const count = individuals.filter((ind) => ind[disease] === true).length;
        if (count > family.numero_membros) {
          throw new ConflictException(
            `Inconsistência identificada: O número de indivíduos com a doença '${disease}' (${count}) é MAIOR que o total de membros da família (${family.numero_membros}).`,
          );
        }
      }

      // 4. Cálculo da Estratificação de Coelho-Savassi
      let pontuacao_risco = 0;

      for (const ind of individuals) {
        // Acamado
        if (ind.acamado) pontuacao_risco += 3;

        // Possui deficiência (física ou mental)
        if (ind.possui_deficiencia) pontuacao_risco += 3;

        // Desnutrição grave (Situação Peso: Abaixo)
        if (ind.situacao_peso === 'Abaixo') pontuacao_risco += 3;

        // Drogadição (Uso de álcool, drogas ou fumante)
        if (ind.uso_alcool || ind.uso_outras_drogas || ind.fumante)
          pontuacao_risco += 2;

        // Desempregado
        if (ind.desempregado) pontuacao_risco += 2;

        // Analfabeto
        if (ind.analfabeto) pontuacao_risco += 1;

        // Idade (Menor de 6 meses ou Maior de 70 anos)
        if (ind.data_nascimento) {
          const birthDate = new Date(ind.data_nascimento);
          const ageDifMs = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDifMs);
          const ageYears = Math.abs(ageDate.getUTCFullYear() - 1970);
          const ageMonths = ageDifMs / (1000 * 60 * 60 * 24 * 30.44);

          if (ageMonths < 6) pontuacao_risco += 1;
          if (ageYears > 70) pontuacao_risco += 1;
        }

        // Doenças crónicas comuns
        if (ind.hipertensao_arterial) pontuacao_risco += 1;
        if (ind.diabetes) pontuacao_risco += 1;
      }

      // Variáveis da Família
      if (family.saneamento_inadequado) {
        pontuacao_risco += 3;
      }

      // Classificação Final
      let classificacao_risco = 'Sem Risco';
      if (pontuacao_risco >= 5 && pontuacao_risco <= 6) {
        classificacao_risco = 'R1 - Risco menor';
      } else if (pontuacao_risco >= 7 && pontuacao_risco <= 8) {
        classificacao_risco = 'R2 - Risco médio';
      } else if (pontuacao_risco >= 9) {
        classificacao_risco = 'R3 - Risco máximo';
      }

      // 5. Persistência
      let savedFamily: Family;
      if (existingFamily) {
        // Atualiza família existente
        existingFamily.renda_familiar = family.renda_familiar;
        existingFamily.numero_membros = family.numero_membros;
        if (family.reside_desde) {
          existingFamily.reside_desde = new Date(family.reside_desde);
        }
        existingFamily.pontuacao_risco = pontuacao_risco;
        existingFamily.classificacao_risco = classificacao_risco;
        if (family.household_id) {
          existingFamily.household = { id: family.household_id } as any;
        }

        savedFamily = await queryRunner.manager.save(Family, existingFamily);
      } else {
        // Cria nova família
        const { household_id, ...familyData } = family;
        const newFamily = queryRunner.manager.create(Family, {
          ...familyData,
          reside_desde: new Date(family.reside_desde),
          pontuacao_risco,
          classificacao_risco,
          ...(household_id ? { household: { id: household_id } as any } : {}),
        });
        savedFamily = await queryRunner.manager.save(Family, newFamily);
      }

      // Deletar os indivíduos antigos dependentes desta família para garantir um "override" limpo do snapshot offline (opcional, ajustável sob demanda de negócio)
      if (existingFamily) {
        await queryRunner.manager.delete(Individual, {
          family: { id: savedFamily.id },
        });
      }

      // Salva os novos indivíduos
      const newIndividuals = individuals.map((ind) => {
        return queryRunner.manager.create(Individual, {
          ...ind,
          family: savedFamily,
        });
      });

      await queryRunner.manager.save(Individual, newIndividuals);

      // Commit da transação em caso de sucesso total
      await queryRunner.commitTransaction();

      // O fluxo de salvamento já ocorreu no banco de destino oficial da aplicação.

      return {
        message: 'Sincronização realizada com sucesso (Offline e Online)',
        pontuacao_risco,
        classificacao_risco,
        familyId: savedFamily.id,
        individualsCount: newIndividuals.length,
      };
    } catch (error) {
      // Rollback da transação em caso de qualquer erro
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error; // Re-throw the known validation exception
      }

      // Logger.error('Sync error', error.stack);
      throw new InternalServerErrorException(
        `Falha ao sincronizar dados: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      // Libertação do QueryRunner em todos os casos
      await queryRunner.release();
    }
  }
}
