import { Field, Int, ObjectType, ID } from '@nestjs/graphql'
import { User as UserClient } from '@prisma/client'

@ObjectType()
export class UserModel implements UserClient {
  @Field(() => ID)
  id: string

  @Field(() => String)
  userName: string

  @Field(() => String)
  email: string

  @Field(() => String)
  clerkId: string

  @Field(() => String)
  firstName: string

  @Field(() => String)
  lastName: string

  @Field(() => String)
  password: string

  @Field(() => String)
  phoneNumber: string

  @Field(() => String)
  userBio: string

  @Field(() => String)
  avatar: string

  @Field(() => Boolean)
  isPro: boolean

  @Field(() => Boolean)
  isActive: boolean

  @Field(() => [String])
  offerIds: string[]

  @Field(() => [String])
  bookmarks: string[]

  @Field(() => [String])
  conversations: string[]

  @Field(() => Date)
  createdAt: Date

  @Field(() => Date)
  updatedAt: Date
}
