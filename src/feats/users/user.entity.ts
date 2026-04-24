import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  ACS = 'acs',
}

export class CreateUserDto {
  @ApiProperty({ description: 'CPF único do usuário', example: '12345678900' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'senha123' })
  @IsString()
  @IsNotEmpty()
  senha: string;

  @ApiProperty({ enum: UserRole, default: UserRole.ACS })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Microárea vinculada' })
  @IsString()
  @IsOptional()
  microarea?: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  cpf: string;

  @Column()
  senha: string;

  @Column({ type: 'varchar', default: UserRole.ACS })
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  microarea: string | null;

  constructor(userDto?: CreateUserDto) {
    if (userDto) {
      this.cpf = userDto.cpf;
      this.senha = userDto.senha;
      this.role = userDto.role || UserRole.ACS;
      this.microarea = userDto.microarea || null;
    }
  }
}
