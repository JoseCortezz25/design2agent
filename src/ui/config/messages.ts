export const messages = {
  common: {
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      export: 'Exportar',
      confirm: 'Confirmar',
      back: 'Volver',
      retry: 'Reintentar',
      continue: 'Continuar',
      create: 'Crear',
      delete: 'Eliminar'
    },
    errors: {
      required: 'Este campo es requerido',
      serverError: 'Algo salió mal. Intenta de nuevo.',
      networkError: 'Error de conexión. Verifica tu red.',
      sessionExpired: 'Tu sesión expiró. Inicia sesión de nuevo.'
    },
    navigation: {
      next: 'Siguiente',
      previous: 'Anterior'
    },
    status: {
      loading: 'Cargando...',
      success: 'Operación exitosa',
      error: 'Ocurrió un error'
    },
    designMd: {
      bootstrapping: 'Inicializando flujo DESIGN.md'
    }
  }
} as const;
