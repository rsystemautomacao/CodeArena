import Link from 'next/link';

export default function CreateExercisePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Novo exercício</h1>
          <p className="mt-2 text-gray-600">
            Estamos finalizando o construtor de exercícios. Logo você poderá criar desafios com casos
            de teste automáticos.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="text-gray-500">
            Fique tranquilo, sua ideia de exercício não será perdida!
            Enquanto trabalhamos nessa tela, utilize o suporte para registrar as atividades
            que deseja aplicar.
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

