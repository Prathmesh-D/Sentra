import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown rendering error',
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI runtime error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Rendering error</h1>
          <p className="text-gray-700 mb-4">
            Sentra hit a UI error after navigation. Reload the app to recover.
          </p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 border border-gray-200">
            {this.state.errorMessage}
          </pre>
          <div className="mt-4">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      </div>
    )
  }
}
