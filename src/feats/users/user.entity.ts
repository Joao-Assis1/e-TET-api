import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  PROFISSIONAL = 'profissional',
}

export class CreateUserDto {
  @ApiProperty({ description: 'Nome de usuário único', example: 'acs_jose' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'senha123' })
  @IsString()
  @IsNotEmpty()
  senha: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.PROFISSIONAL })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Cartão Nacional de Saúde (CNS)', example: '209384756100005' })
  @IsOptional()
  @IsString()
  cns_profissional?: string;

  @ApiPropertyOptional({ description: 'CNES da Unidade Básica de Saúde', example: '7654321' })
  @IsOptional()
  @IsString()
  cnes_estabelecimento?: string;

  @ApiPropertyOptional({ description: 'Código INE da Equipe de Saúde', example: '0000123456' })
  @IsOptional()
  @IsString()
  ine_equipe?: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario: string;

  @Column()
  senha: string;

  @Column({ type: 'varchar', default: UserRole.PROFISSIONAL })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  cns_profissional: string | null;

  @Column({ type: 'varchar', nullable: true })
  cnes_estabelecimento: string | null;

  @Column({ type: 'varchar', nullable: true })
  ine_equipe: string | null;

  constructor(userDto?: CreateUserDto) {
    if (userDto) {
      this.usuario = userDto.usuario;
      this.senha = userDto.senha;
      this.role = userDto.role ?? UserRole.PROFISSIONAL;
      this.cns_profissional = userDto.cns_profissional ?? null;
      this.cnes_estabelecimento = userDto.cnes_estabelecimento ?? null;
      this.ine_equipe = userDto.ine_equipe ?? null;
    }
  }
}
