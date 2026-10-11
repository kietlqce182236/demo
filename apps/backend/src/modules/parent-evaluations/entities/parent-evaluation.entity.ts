import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../database/base.entity';
import { Child } from '../../children/entities/child.entity';
import { Menu } from '../../menus/entities/menu.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('parent_evaluations')
export class ParentEvaluation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'student_id', type: 'bigint', transformer: BigIntTransformer })
  studentId: number;

  @Column({ name: 'menu_id', type: 'bigint', transformer: BigIntTransformer, nullable: true })
  menuId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Child;

  @ManyToOne(() => Menu, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @OneToMany(() => EvaluationReply, (reply) => reply.evaluation)
  replies: EvaluationReply[];
}

@Entity('evaluation_replies')
export class EvaluationReply {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'evaluation_id', type: 'bigint', transformer: BigIntTransformer })
  evaluationId: number;

  @Column({ name: 'replied_by', type: 'bigint', transformer: BigIntTransformer })
  repliedBy: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'replied_at', type: 'timestamptz' })
  repliedAt: Date;

  @ManyToOne(() => ParentEvaluation, (evalEntity) => evalEntity.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: ParentEvaluation;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'replied_by' })
  user: User;
}
