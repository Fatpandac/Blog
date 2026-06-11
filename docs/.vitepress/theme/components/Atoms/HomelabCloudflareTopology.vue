<template>
  <figure class="homelab-topology not-prose">
    <svg viewBox="0 0 960 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Homelab HTTPS 拓扑图">
      <defs>
        <pattern id="homelab-topology-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="#E3E2DC" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="#f5f4ed" />
      <rect width="100%" height="100%" fill="url(#homelab-topology-dots)" opacity="0.55" />

      <rect x="64" y="32" width="832" height="152" rx="8" fill="#faf9f5" stroke="#B2B1AC" stroke-width="1" />
      <text x="88" y="64" fill="#6b6a64" font-size="12" font-family="monospace" letter-spacing="2">DNS 与证书</text>

      <rect x="64" y="212" width="832" height="132" rx="8" fill="#faf9f5" stroke="#B2B1AC" stroke-width="1" />
      <text x="88" y="236" fill="#6b6a64" font-size="12" font-family="monospace" letter-spacing="2">同局域网访问</text>

      <rect x="64" y="380" width="832" height="144" rx="8" fill="#faf9f5" stroke="#B2B1AC" stroke-width="1" />
      <text x="88" y="404" fill="#6b6a64" font-size="12" font-family="monospace" letter-spacing="2">局域网外访问</text>

      <!-- DNS always resolves the public name to the home LAN address. -->
      <line x1="208" y1="120" x2="336" y2="120" stroke="#504e49" stroke-width="1.2" />
      <path d="M328 112 L336 120 L328 128" fill="none" stroke="#504e49" stroke-width="1.4" stroke-linecap="round" />
      <rect x="236" y="100" width="72" height="16" rx="2" fill="#f5f4ed" />
      <text x="272" y="112" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">DNS 查询</text>

      <line x1="704" y1="120" x2="560" y2="120" stroke="#504e49" stroke-width="1.2" stroke-dasharray="6 6" />
      <path d="M568 112 L560 120 L568 128" fill="none" stroke="#504e49" stroke-width="1.4" stroke-linecap="round" />
      <rect x="592" y="100" width="80" height="16" rx="2" fill="#f5f4ed" />
      <text x="632" y="112" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">DNS-01</text>

      <!-- Same-LAN access: DNS result can be reached directly on the home network. -->
      <line x1="224" y1="288" x2="384" y2="288" stroke="#1B365D" stroke-width="1.6" />
      <path d="M376 280 L384 288 L376 296" fill="none" stroke="#1B365D" stroke-width="1.6" stroke-linecap="round" />
      <rect x="268" y="268" width="72" height="16" rx="2" fill="#f5f4ed" />
      <text x="304" y="280" fill="#1B365D" font-size="10" font-family="monospace" text-anchor="middle">局域网 IP</text>

      <line x1="544" y1="288" x2="704" y2="288" stroke="#504e49" stroke-width="1.4" />
      <path d="M696 280 L704 288 L696 296" fill="none" stroke="#504e49" stroke-width="1.4" stroke-linecap="round" />
      <rect x="600" y="268" width="48" height="16" rx="2" fill="#f5f4ed" />
      <text x="624" y="280" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">PROXY</text>

      <!-- Remote access: DNS still returns the LAN address, Tailscale carries that route. -->
      <line x1="208" y1="464" x2="240" y2="464" stroke="#1B365D" stroke-width="1.6" />
      <path d="M232 456 L240 464 L232 472" fill="none" stroke="#1B365D" stroke-width="1.6" stroke-linecap="round" />

      <line x1="368" y1="464" x2="400" y2="464" stroke="#1B365D" stroke-width="1.6" />
      <path d="M392 456 L400 464 L392 472" fill="none" stroke="#1B365D" stroke-width="1.6" stroke-linecap="round" />

      <line x1="544" y1="464" x2="584" y2="464" stroke="#504e49" stroke-width="1.4" />
      <path d="M576 456 L584 464 L576 472" fill="none" stroke="#504e49" stroke-width="1.4" stroke-linecap="round" />

      <line x1="712" y1="464" x2="752" y2="464" stroke="#504e49" stroke-width="1.4" />
      <path d="M744 456 L752 464 L744 472" fill="none" stroke="#504e49" stroke-width="1.4" stroke-linecap="round" />

      <rect x="80" y="84" width="128" height="72" rx="6" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1" />
      <text x="100" y="108" fill="#6b6a64" font-size="11" font-family="monospace" letter-spacing="1.6">CLIENT</text>
      <text x="144" y="132" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">访问设备</text>
      <text x="144" y="148" fill="#504e49" font-size="11" font-family="monospace" text-anchor="middle">Browser</text>

      <rect x="336" y="76" width="224" height="88" rx="6" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2" />
      <text x="356" y="104" fill="#1B365D" font-size="11" font-family="monospace" letter-spacing="1.6">DNS + CERT</text>
      <text x="448" y="124" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">
        Cloudflare DNS
      </text>
      <text x="448" y="136" fill="#504e49" font-size="9.5" font-family="monospace" text-anchor="middle">
        <tspan x="448" y="136">gitea.fatpandac.com</tspan>
        <tspan x="448" y="148">A 记录 -&gt; 192.168.31.x</tspan>
      </text>

      <rect x="704" y="84" width="144" height="72" rx="6" fill="#faf9f5" stroke="#141413" stroke-width="1" />
      <text x="724" y="108" fill="#141413" font-size="11" font-family="monospace" letter-spacing="1.6">SERVICE</text>
      <text x="776" y="132" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">Caddy</text>
      <text x="776" y="148" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">TLS 证书</text>

      <rect x="80" y="252" width="144" height="72" rx="6" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1" />
      <text x="100" y="276" fill="#6b6a64" font-size="11" font-family="monospace" letter-spacing="1.6">LAN</text>
      <text x="152" y="300" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">同局域网设备</text>
      <text x="152" y="316" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">DNS 后直连</text>

      <rect x="384" y="252" width="160" height="72" rx="6" fill="#EAE9E2" stroke="#504e49" stroke-width="1" />
      <text x="404" y="276" fill="#504e49" font-size="11" font-family="monospace" letter-spacing="1.6">HOST</text>
      <text x="464" y="300" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">树莓派</text>
      <text x="464" y="316" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">Caddy · 192.168.31.x</text>

      <rect x="704" y="252" width="128" height="72" rx="6" fill="#EAE9E2" stroke="#504e49" stroke-width="1" />
      <text x="724" y="276" fill="#504e49" font-size="11" font-family="monospace" letter-spacing="1.6">APP</text>
      <text x="768" y="308" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">Gitea</text>

      <rect x="80" y="420" width="128" height="88" rx="6" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1" />
      <text x="100" y="448" fill="#6b6a64" font-size="11" font-family="monospace" letter-spacing="1.6">REMOTE</text>
      <text x="144" y="472" fill="#141413" font-size="16" font-weight="600" font-family="serif" text-anchor="middle">局域网外部设备</text>
      <text x="144" y="486" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">
        <tspan x="144" y="486">Tailscale</tspan>
        <tspan x="144" y="498">已登录</tspan>
      </text>

      <rect x="240" y="420" width="128" height="88" rx="6" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2" />
      <text x="260" y="448" fill="#1B365D" font-size="11" font-family="monospace" letter-spacing="1.6">OVERLAY</text>
      <text x="304" y="472" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">Tailscale</text>
      <text x="304" y="496" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">同一个 tailnet</text>

      <rect x="400" y="420" width="144" height="88" rx="6" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2" />
      <text x="420" y="448" fill="#1B365D" font-size="11" font-family="monospace" letter-spacing="1.6">SUBNET</text>
      <text x="472" y="472" fill="#141413" font-size="14" font-weight="600" font-family="serif" text-anchor="middle">Tailscale 子网路由</text>
      <text x="472" y="496" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">192.168.31.0/24</text>

      <rect x="584" y="420" width="128" height="88" rx="6" fill="#EAE9E2" stroke="#504e49" stroke-width="1" />
      <text x="604" y="448" fill="#504e49" font-size="11" font-family="monospace" letter-spacing="1.6">HOST</text>
      <text x="648" y="472" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">树莓派</text>
      <text x="648" y="494" fill="#504e49" font-size="10" font-family="monospace" text-anchor="middle">Caddy</text>

      <rect x="752" y="420" width="112" height="88" rx="6" fill="#EAE9E2" stroke="#504e49" stroke-width="1" />
      <text x="772" y="448" fill="#504e49" font-size="11" font-family="monospace" letter-spacing="1.6">APP</text>
      <text x="808" y="480" fill="#141413" font-size="17" font-weight="600" font-family="serif" text-anchor="middle">Gitea</text>
    </svg>
    <figcaption>
      图中实线是访问路径：外部设备解析 <code>gitea.fatpandac.com</code> 后，经由 Tailscale 子网路由进入家庭局域网，再由 Caddy 终止
      HTTPS 并反代到 Gitea。虚线是 Cloudflare DNS 与证书签发的控制面。
    </figcaption>
  </figure>
</template>

<style scoped>
.homelab-topology {
  margin: 1.5rem 0;
}

.homelab-topology svg {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border: 1px solid rgba(107, 106, 100, 0.28);
  border-radius: 8px;
}

.homelab-topology figcaption {
  margin-top: 0.75rem;
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
  line-height: 1.7;
}

.homelab-topology code {
  font-size: 0.9em;
}
</style>
