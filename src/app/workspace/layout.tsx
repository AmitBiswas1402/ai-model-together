const WorkspaceLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="min-h-screen">{children}</div>;
};

export default WorkspaceLayout;
