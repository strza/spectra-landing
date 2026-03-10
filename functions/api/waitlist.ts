/// <reference types="@cloudflare/workers-types" />

interface Env {
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
}

interface WaitlistRequest {
  email: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body = (await context.request.json()) as WaitlistRequest;

    if (!body.email || !body.email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const resendResponse = await fetch(
      `https://api.resend.com/audiences/${context.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          unsubscribed: false,
        }),
      },
    );

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to join waitlist" }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
