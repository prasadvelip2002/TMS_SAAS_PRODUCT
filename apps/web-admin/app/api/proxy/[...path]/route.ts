import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string {
  // If running on Vercel or cloud production, route to live Render backend
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return process.env.INTERNAL_API_URL 
      || process.env.NEXT_PUBLIC_API_URL 
      || "https://tms-saas-product.onrender.com/api";
  }
  // Local development fallback
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5063/api";
}

export async function GET(request: NextRequest, context: { params: any }) {
  const path = await resolvePath(context.params);
  return handleProxy(request, path);
}

export async function POST(request: NextRequest, context: { params: any }) {
  const path = await resolvePath(context.params);
  return handleProxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: any }) {
  const path = await resolvePath(context.params);
  return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  const path = await resolvePath(context.params);
  return handleProxy(request, path);
}

async function resolvePath(paramsOrPromise: any): Promise<string> {
  const resolved = await Promise.resolve(paramsOrPromise);
  const pathSegments = resolved?.path || [];
  return Array.isArray(pathSegments) ? pathSegments.join("/") : String(pathSegments || "");
}

async function handleProxy(request: NextRequest, path: string) {
  const search = request.nextUrl.search;
  const backendBase = getBackendUrl().replace(/\/$/, "");
  const targetUrl = `${backendBase}/${path}${search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["authorization"] = authHeader;
  }

  const options: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) {
        options.body = body;
      }
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(targetUrl, options);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error(`[API Proxy Error to ${targetUrl}]:`, error?.message);
    return NextResponse.json(
      { error: "Backend proxy communication failed", details: error?.message },
      { status: 502 }
    );
  }
}
