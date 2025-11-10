import Link from 'next/link';

export default function CreateAssignmentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nova atividade</h1>
          <p className="mt-2 text-gray-600">
            No futuro você poderá montar listas de exercícios, provas e atividades avaliativas
            diretamente por aqui.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="text-gray-500">
            Esta área ainda está em desenvolvimento. Caso precise planejar uma nova atividade agora,
            entre em contato com o suporte e passaremos as instruções.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Voltar ao painel do professor
          </Link>
        </div>
      </div>
    </div>
  );
}

