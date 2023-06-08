import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaService } from './prisma.service'
import { HelloResolver } from './resolvers/hello.resolver'
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { AuthResolver } from './resolvers/auth.resolver'
import { NewOfferResolver } from './resolvers/newOffer.resolver'
import { GetOffersResolver } from './resolvers/offers.resolver'
import { GetUserDataByIdResolver } from './resolvers/getUserDataById.resolver'
import { BookmarksResolver } from './resolvers/bookmarks.resolver'
import { GetUserDataResolver } from './resolvers/getUserData.resolver'
import { GetPlantersResolver } from './resolvers/planters.resolver'
//comments
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: false,
      playground: true,
      introspection: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    AppService,
    HelloResolver,
    AuthResolver,
    NewOfferResolver,
    GetOffersResolver,
    GetUserDataByIdResolver,
    BookmarksResolver,
    GetUserDataResolver,
    GetPlantersResolver,
  ],
})
export class AppModule {
  constructor(private readonly prismaService: PrismaService) {}
}
