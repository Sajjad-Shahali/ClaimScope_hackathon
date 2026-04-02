import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="panel flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10">
            <AlertTriangle className="h-8 w-8 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
            <p className="mt-1 text-sm text-slate-400">{this.state.error.message}</p>
          </div>
          <button className="button" onClick={() => this.setState({ error: null })}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
