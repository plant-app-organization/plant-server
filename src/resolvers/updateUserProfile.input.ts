import { InputType, Field } from '@nestjs/graphql'

@InputType()
export class UpdateUserProfileInput {
  @Field(() => String, { nullable: true })
  bio?: string

  @Field(() => String, { nullable: true })
  avatarUrl?: string

  @Field(() => String, { nullable: true })
  avatarThumbnail?: string
}
