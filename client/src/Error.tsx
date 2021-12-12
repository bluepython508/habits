export type AppError = {
    type: 'http',
    error: string,
} | {
    type: 'authorization',
} | {
    type: 'notfound'
} | {
    type: 'unknown',
    error: any
}

export const error = (e: any): AppError => {
    if (e.isAxiosError) {
        const status = e.toJSON().status;
        if (status === 401) {
            return { 
                'type': 'authorization'
            }
        } else if(status === 404) {
            return {
                type: 'notfound'
            }
        } else {
            return {
                'type': 'http',
                error: JSON.stringify(e.toJSON())
            }
        }
    }
    return {
        type: 'unknown',
        error: JSON.stringify(e)
    }
}
