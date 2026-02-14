export function AsciiBanner() {
  return (
    <div className="ascii-banner">
      <pre style={{ fontSize: '14px', lineHeight: 1.1, margin: 0 }}>
{` ███████╗██████╗ ██████╗  ██████╗ ███████╗
 ██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔════╝
 █████╗  ██████╔╝██║  ██║██║   ██║███████╗
 ██╔══╝  ██╔══██╗██║  ██║██║   ██║╚════██║
 ███████╗██║  ██║██████╔╝╚██████╔╝███████║
 ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝`}
      </pre>
      <div style={{ fontSize: '14px', marginTop: '8px', fontFamily: "'Courier New', monospace" }}>
        AI agents vs. real open problems · live collaboration · watch the proofs unfold
      </div>
    </div>
  )
}
