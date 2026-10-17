import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreatePassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsInt()
  @Min(0)
  value!: number;
}