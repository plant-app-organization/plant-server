import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { HelloResolver } from './resolvers/hello.resolver';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { AuthResolver } from './resolvers/auth.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      debug: false,
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [PrismaService, AppService, HelloResolver, AuthResolver],
})
export class AppModule {
  constructor(private readonly prismaService: PrismaService) {}
}
