import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  GESTOR = 'gestor',
  PROFISSIONAL = 'profissional',
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ description: 'Cartão Nacional de Saúde', example: '209384756100005' })
  @IsOptional()
  @IsString()
  cns?: string;

  @ApiPropertyOptional({ description: 'Código do Estabelecimento de Saúde', example: '7654321' })
  @IsOptional()
  @IsString()
  cne?: string;
}

@Entity('users')
export class User {
  constructor(userDto?: CreateUserDto) {
    if (userDto) {
      this.usuario = userDto.usuario;
      this.senha = userDto.senha;
      this.role = userDto.role ?? UserRole.PROFISSIONAL;
      this.cns = userDto.cns ?? null;
      this.cne = userDto.cne ?? null;
    }
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario: string;

  @Column()
  senha: string;

  @Column({ type: 'varchar', default: UserRole.PROFISSIONAL })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  cns: string | null;

  @Column({ type: 'varchar', nullable: true })
  cne: string | null;
}
