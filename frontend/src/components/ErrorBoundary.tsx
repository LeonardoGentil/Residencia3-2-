import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 p-6 text-center space-y-3">
            <div className="text-red-500 dark:text-red-400 font-semibold">Algo deu errado</div>
            <pre className="text-xs text-left bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-slate-700 dark:text-slate-300 rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
            <button onClick={() => window.location.reload()} className="text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
