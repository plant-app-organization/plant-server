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
import { GetMyUserDataResolver } from './resolvers/getMyUserData.resolver'
import { GetPlantersResolver } from './resolvers/planters.resolver'
import { GetSuggestionsResolver } from './resolvers/suggestions.resolver'
import { GetOffersDataByIdsResolver } from './resolvers/getOffersDataByIds.resolver'
import { MessagesResolver } from './resolvers/messages.resolver'
import { ResetResolver } from './resolvers/resetDatabase.resolver'
import { FollowResolver } from './resolvers/follow.resolver'
import { MailinglistController } from './mailinglist/mailinglist.controller'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: false,
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      installSubscriptionHandlers: true,
    }),
  ],
  controllers: [AppController, MailinglistController],
  providers: [
    PrismaService,
    AppService,
    HelloResolver,
    AuthResolver,
    NewOfferResolver,
    GetOffersResolver,
    GetUserDataByIdResolver,
    BookmarksResolver,
    GetMyUserDataResolver,
    GetPlantersResolver,
    GetSuggestionsResolver,
    GetOffersDataByIdsResolver,
    MessagesResolver,
    ResetResolver,
    FollowResolver,
  ],
})
export class AppModule {
  constructor(private readonly prismaService: PrismaService) {}
}
