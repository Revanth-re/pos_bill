import { NextResponse } from "next/server";

/**
 * Digital Asset Links for the Play Store app (TWA). Served at /.well-known/assetlinks.json
 * via a rewrite in next.config.ts, so it works even if the hidden ".well-known" folder
 * gets lost when the project is copied.
 * To add Google Play's app-signing key later, put its SHA-256 in the list below.
 */
const FINGERPRINTS = [
  "E9:60:B0:A2:1F:87:4F:2D:EF:72:A9:38:F3:FB:38:64:95:EE:70:54:15:FD:AB:CC:84:3B:8F:61:76:34:EF:7E", // upload key (PWABuilder)
];

export function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: "in.getbillo.twa", sha256_cert_fingerprints: FINGERPRINTS },
      },
    ],
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
