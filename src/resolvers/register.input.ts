import { InputType, Field } from '@nestjs/graphql'
import { IsEmail, MinLength } from 'class-validator'

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string

  @Field()
  userName: string

  @Field()
  clerkId: string
}
