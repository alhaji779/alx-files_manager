import mongodb from 'mongodb';
import ObjectId from 'mongodb';

/**
 * class to manage mongodb instance
 */

class DBClient {

    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const fullUrl = `mongodb://${host}:${port}/${database}`;

        this.myDb = new mongodb.MongoClient(fullUrl, { useUnifiedTopology: true});
        this.myDb.connect();
    }

    /**
     * function to check if mongodb is active
     */
    isAlive() {
        return this.myDb.isConnected();
    }

    /**
     * function to show number of used in db
     */
    async nbUsers() {
        return this.myDb.db().collection('users').countDocuments();
    }

    /**
     * function to show number of files in db
     */
    async nbFiles() {
        return this.myDb.db().collection('files').countDocuments();
    }

    /**
     * Retrieves all users collection. 
     */
    async allUsersCollection() {
        return this.myDb.db().collection('users');
    }
    
    /**
     * Retrieves all `files` collection.
     * 
     */
    async allFilesCollection() {
        return this.myDb.db().collection('files');
    }

    convertToObjectId(id) {
        return new ObjectId(id);
      }
}

export const dbClient = new DBClient();
export default dbClient;