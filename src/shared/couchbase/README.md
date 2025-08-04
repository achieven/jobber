# Couchbase Connection Manager

A comprehensive Couchbase connection management system with dynamic bucket/collection support and DAO pattern. **No manual initialization required!**

## Features

- ✅ **Lazy Loading**: Connection established only when first DAO is used
- ✅ **Singleton Pattern**: Single connection shared across the application
- ✅ **Dynamic Bucket Management**: Create buckets on-demand at runtime
- ✅ **Connection Caching**: Buckets and collections are cached for performance
- ✅ **Automatic Reconnection**: Handles connection failures gracefully
- ✅ **Base DAO Class**: Common CRUD operations included
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Environment Configuration**: Uses environment variables for configuration

## Quick Start

### No Manual Initialization Required!

```typescript
import { UserDAO } from './shared/couchbase/example-dao';

// Connection is automatically established when you create the first DAO
const userDAO = new UserDAO();

// Create a user - connection was already established in constructor
const user = await userDAO.createUser({
    name: 'John Doe',
    email: 'john@example.com'
});
```

## Create Your Own DAO

```typescript
import { BaseDAO } from './shared/couchbase/base-dao';

interface User {
    id: string;
    name: string;
    email: string;
}

class UserDAO extends BaseDAO {
    constructor() {
        // Connection automatically initialized here!
        // Use 'users' bucket, '_default' scope, '_default' collection
        super('users');
    }

    async createUser(user: Omit<User, 'id'>): Promise<User> {
        const id = `user::${user.email}`;
        const userDoc = { id, ...user };
        await this.insert(id, userDoc);
        return userDoc;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const id = `user::${email}`;
        return await this.get<User>(id);
    }
}
```

## Advanced Usage

### Dynamic Bucket/Collection Selection

```typescript
class OrderDAO extends BaseDAO {
    constructor() {
        // Connection automatically initialized here too!
        // Use 'orders' bucket, 'ecommerce' scope, 'orders' collection
        super('orders', 'ecommerce', 'orders');
    }

    async createOrder(order: any) {
        const id = `order::${Date.now()}`;
        await this.insert(id, order);
        return order;
    }
}
```

### Direct Connection Manager Usage (if needed)

```typescript
import { couchbaseManager } from './shared/couchbase/connection-manager';

// Only if you need direct access to the connection manager
await couchbaseManager.initialize(); // Manual initialization if needed

// Get a specific bucket
const bucket = await couchbaseManager.getBucket('my-bucket');

// Get a specific collection
const collection = await couchbaseManager.getCollection('my-bucket', 'my-scope', 'my-collection');

// List all buckets
const buckets = await couchbaseManager.listBuckets();

// List collections in a scope
const collections = await couchbaseManager.listCollections('my-bucket', 'my-scope');
```

## Environment Variables

```bash
COUCHBASE_HOST=localhost
COUCHBASE_PORT=8091
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=password
COUCHBASE_TIMEOUT=10000
```

## Connection Lifecycle

### Lazy Initialization
- Connection is established only when the first DAO is instantiated
- No manual initialization required
- Subsequent DAOs use the same connection
- Buckets are created automatically if they don't exist

### Usage
- Buckets and collections are retrieved from cache when possible
- New buckets are created automatically with default settings
- Connection errors are handled gracefully

### Cleanup
```typescript
import { couchbaseManager } from './shared/couchbase/connection-manager';

// Close connection when shutting down
await couchbaseManager.close();
```

## Error Handling

The system handles common errors:
- **Connection failures**: Automatic retry with exponential backoff
- **Bucket not found**: Automatic creation with default settings
- **Document not found**: Returns null instead of throwing
- **Permission errors**: Clear error messages with context

## Performance Features

- **Lazy Loading**: Connection established only when needed
- **Connection Pooling**: Single cluster connection shared across all operations
- **Bucket Caching**: Buckets are cached after first access
- **Collection Caching**: Collections are cached by bucket:scope:collection key

## Best Practices

1. **No manual initialization**: Just create your DAOs and use them
2. **Use DAOs**: Extend `BaseDAO` for consistent data access patterns
3. **Handle errors**: Always wrap operations in try-catch blocks
4. **Close connections**: Call `close()` when shutting down the application
5. **Use meaningful keys**: Use descriptive document keys (e.g., `user::email@domain.com`)

## Example Project Structure

```
src/
├── shared/
│   └── couchbase/
│       ├── connection-manager.ts    # Main connection manager
│       ├── base-dao.ts             # Base DAO class with lazy init
│       ├── example-dao.ts          # Example implementations
│       └── connect.ts              # Manual connect function (optional)
├── dao/
│   ├── user-dao.ts                 # User data access
│   ├── order-dao.ts                # Order data access
│   └── product-dao.ts              # Product data access
└── main.ts                         # App startup (no Couchbase init needed)
```

## Migration from Manual Initialization

If you were previously using manual initialization:

```typescript
// OLD WAY (no longer needed)
import { couchbaseManager } from './shared/couchbase';
await couchbaseManager.initialize();

// NEW WAY (automatic)
import { UserDAO } from './dao/user-dao';
const userDAO = new UserDAO(); // Connection automatically established
``` 