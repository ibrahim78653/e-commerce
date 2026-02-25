from database import client
print(f"Client write concern: {client.write_concern}")
print(f"Client document: {client.options.pool_options.write_concern}")
