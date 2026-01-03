import sql from 'mssql';

const defaultConnectionString =
  process.env.DB_CONNECTION_STRING ||
  "Server=49.176.252.202,1433;Database=casewise-assess;User Id=casewiseDbUser;Password='casewiseDb@2026!';TrustServerCertificate=True;MultipleActiveResultSets=true;Encrypt=False";

const poolPromise = new sql.ConnectionPool({ connectionString: defaultConnectionString }).connect();

function normalizeQuery(text: string): string {
  return text.replace(/\$(\d+)/g, (_, index) => `@p${index}`);
}

async function executeQuery(pool: sql.ConnectionPool | sql.Transaction, text: string, params: any[] = []) {
  const request = pool.request();
  params.forEach((value, idx) => {
    request.input(`p${idx + 1}`, value);
  });

  const formatted = normalizeQuery(text);
  const result = await request.query(formatted);
  return {
    rows: result.recordset,
    rowCount: result.rowsAffected?.[0] ?? result.recordset.length,
  };
}

export async function query(text: string, params: any[] = []) {
  const pool = await poolPromise;
  return executeQuery(pool, text, params);
}

export async function transaction<T>(callback: (client: { query: typeof query }) => Promise<T>): Promise<T> {
  const pool = await poolPromise;
  const tx = new sql.Transaction(pool);

  await tx.begin();
  const transactionalClient = {
    query: (text: string, params: any[] = []) => executeQuery(tx, text, params),
  };

  try {
    const result = await callback(transactionalClient);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}