import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome de usuário único', example: 'acs_jose' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'senha123' })
  @IsString()
  @IsNotEmpty()
  senha: string;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario: string;

  @Column()
  senha: string;

  constructor(userDto?: CreateUserDto) {
    if (userDto) {
      this.usuario = userDto.usuario;
      this.senha = userDto.senha;
    }
  }
}
