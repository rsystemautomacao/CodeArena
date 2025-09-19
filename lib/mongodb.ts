import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Só validar MONGODB_URI se estivermos em produção ou se a variável estiver definida
if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
  throw new Error('Por favor, defina a variável MONGODB_URI no arquivo .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Em modo de desenvolvimento, se não há MONGODB_URI, retornar null
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI não definida. Funcionando em modo de desenvolvimento sem banco de dados.');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

declare global {
  var mongoose: any;
}
