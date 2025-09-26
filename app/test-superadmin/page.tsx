'use client';

import { useState } from 'react';

export default function TestSuperadminPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSuperadmin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-superadmin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@rsystem.com',
          password: '@Desbravadores@93'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Erro ao testar: ' + error });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🧪 Teste do Superadmin - CodeArena
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Credenciais de Teste</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>Email:</strong> admin@rsystem.com</p>
            <p><strong>Senha:</strong> @Desbravadores@93</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={testSuperadmin}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded w-full"
          >
            {loading ? 'Testando...' : '🧪 Testar Login do Superadmin'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resultado do Teste</h2>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
