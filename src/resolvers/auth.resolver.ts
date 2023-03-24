import { Mutation, Resolver, Args, Context } from '@nestjs/graphql'
import { PrismaService } from '../prisma.service'
import { RegisterInput } from './register.input'
import { User } from '@prisma/client'
import clerk from '@clerk/clerk-sdk-node'

@Resolver()
export class AuthResolver {
  constructor(private prisma: PrismaService) {}
  @Mutation(() => String)
  async register(
    @Context() context,
    @Args('newUserInput') registerInput: RegisterInput,
  ): Promise<string> {
    console.log('🔥registerInput dans le resolver register', registerInput)
    // console.log('💎token dans les headers', context.req.headers.authorization.split(' ')[1])
    // const authorizationHeader = context.req.headers.authorization
    // const token = authorizationHeader.split(' ')[1] // extract the token from the header
    // const client = await clerk.clients.verifyClient(token)
    // console.log('clerkId : ', client.sessions[0].userId)
    // Create a new user record in the Prisma database     and Associate the Clerk user ID with the Prisma user record

    // create user in DB

    const result = await this.prisma.user.create({
      data: registerInput,
    })
    console.log('result', result)

    return 'user enregistré'
  }
}
