import { Module } from '@nestjs/common';
import { ErrorVectorMessageDAO } from './error-vector-message-dao';
import { ErrorCategoriesVectorDAO } from './error-categories-vector-dao';
import { JobsDAO } from './jobs-dao';

@Module({
    providers: [JobsDAO, ErrorVectorMessageDAO, ErrorCategoriesVectorDAO],
    exports: [JobsDAO, ErrorVectorMessageDAO, ErrorCategoriesVectorDAO]
})

export class CouchbaseModule {}