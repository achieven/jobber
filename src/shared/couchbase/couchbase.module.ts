import { Module } from '@nestjs/common';
import { ErrorVectorDAO } from './error-vector-dao';
import { JobsDAO } from './jobs-dao';


@Module({
    providers: [JobsDAO, ErrorVectorDAO],
    exports: [JobsDAO, ErrorVectorDAO]
})

export class CouchbaseModule {}