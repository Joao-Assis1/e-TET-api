import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsString()
  @IsNotEmpty()
  senha: string;
}

@Entity('users')
export class User {
  constructor(userDto?: CreateUserDto) {
    if (userDto) {
      this.usuario = userDto.usuario;
      this.senha = userDto.senha;
    }
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  usuario: string;

  @Column()
  senha: string;

}
