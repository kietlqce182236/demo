import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStudentEnrollmentDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  studentId: number;

  @ApiProperty({ example: 'PAID', enum: ['PAID', 'PENDING', 'CANCELLED'] })
  @IsNotEmpty()
  @IsString()
  status: string;
}
