import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare Workers(OpenNext) 배포 설정. 캐시 바인딩 없이 기본(동적 SSR) 구성.
export default defineCloudflareConfig();
