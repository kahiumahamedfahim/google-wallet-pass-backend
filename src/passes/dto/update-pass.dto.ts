import { IsInt, Min } from 'class-validator';

export class UpdatePassDto {
  @IsInt()
  @Min(0)
  value!: number;
}