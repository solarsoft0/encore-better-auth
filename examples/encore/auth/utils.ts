import { Paginated } from "./auth.interface";

type PaginatedParams = {
  size: number;
  page: number;
  count: number;
};

export const getOffset = (page: number, size: number): number => {
  return size * (page - 1);
};

export const paginatedData = (params: PaginatedParams): Paginated => {
  const response = {
    current: params.page,
    pageSize: params.size,
    totalPages: Math.ceil(params.count / params.size),
    count: params.count,
  };
  return response;
};



export function getBaseURL(url?: string, path?: string) {
    if (url) {
        return withPath(url, path);
    }
    return undefined;
}

function withPath(url: string, path = "/api/auth") {
    const hasPath = checkHasPath(url);
    if (hasPath) {
        return url;
    }
    path = path.startsWith("/") ? path : `/${path}`;
    return `${url.replace(/\/+$/, "")}${path}`;
}

function checkHasPath(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname !== "/";
    } catch (error) {
        throw new BetterAuthError(
            `Invalid base URL: ${url}. Please provide a valid base URL.`
        );
    }
}