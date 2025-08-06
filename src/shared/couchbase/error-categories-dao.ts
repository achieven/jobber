import { BaseDAO } from './base-dao';

export class ErrorCategoriesDAO extends BaseDAO {
    private static insertedErrorCategoriesData = false;

    constructor() {
        super('default', '_default', 'errorCategories');
    }

    protected async ensureInitialized(): Promise<void> {
        console.log('ensuring initialized')
        await super.ensureInitialized();
        if (!ErrorCategoriesDAO.insertedErrorCategoriesData) {
            await this.insertErrorCategoriesData();
        }
    }

    async getErrorCategories(limit: number = 10) {
        return await this.select({
            fields: '*',
            limit
        })
    }

    protected async insertErrorCategoriesData() {
        console.trace();
        console.log('inserting error categories data')
        try {
            // this.insert('errorCategory:C++ error', {
            //     name: 'C++ error',
            // })
            // this.insert('errorCategory:Javascript error', {
            //     name: 'Javascript error',
            // })
            // this.insert('errorCategory:Image processing error', {
            //     name: 'Image processing error',
            // })
            // this.insert('errorCategory:Memory quota exceeded', {
            //     name: 'Memory quota exceeded',
            // })
            // this.insert('errorCategory:Timeout', {
            //     name: 'Timeout',
            // })
            ErrorCategoriesDAO.insertedErrorCategoriesData = true;
        } catch (error) {
            //expecting already exists error
            console.error('Error inserting error categories data:', error);
        }
    }





}