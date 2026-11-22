export default function WorkspaceLoading() {
  return (
    <div className="page-stack skeleton-page" aria-label="Loading workspace" aria-busy="true">
      <div className="skeleton-heading"><span /><span /><span /></div>
      <div className="skeleton-stats">{[1, 2, 3, 4].map((item) => <div className="skeleton-block skeleton-stat" key={item} />)}</div>
      <div className="skeleton-block skeleton-insight" />
      <div className="skeleton-panels"><div className="skeleton-block skeleton-panel" /><div className="skeleton-block skeleton-panel" /></div>
    </div>
  );
}
