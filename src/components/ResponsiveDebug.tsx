import { useResponsive, useResponsiveClasses } from "@/hooks/use-responsive";
import { useMobileDetection, useOrientation } from "@/hooks/use-mobile";

/**
 * Debug component to display responsive information
 * This can be used during development to verify responsive behavior
 */
export const ResponsiveDebug: React.FC = () => {
  const responsive = useResponsive();
  const classes = useResponsiveClasses();
  const detection = useMobileDetection();
  const orientation = useOrientation();

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <h3 className="font-bold mb-2 text-yellow-400">Responsive Debug</h3>
      
      <div className="space-y-1">
        <div><strong>Device:</strong> {responsive.deviceType}</div>
        <div><strong>Orientation:</strong> {responsive.orientation}</div>
        <div><strong>Screen:</strong> {responsive.screenWidth}x{responsive.screenHeight}</div>
        <div><strong>UI Mode:</strong> {responsive.shouldUseMobileUI ? 'Mobile' : 'Desktop'}</div>
        <div><strong>Breakpoint Changed:</strong> {responsive.breakpointChanged ? 'Yes' : 'No'}</div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-600">
        <div><strong>isMobile:</strong> {detection.isMobile ? 'Yes' : 'No'}</div>
        <div><strong>isTablet:</strong> {detection.isTablet ? 'Yes' : 'No'}</div>
        <div><strong>isDesktop:</strong> {detection.isDesktop ? 'Yes' : 'No'}</div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400">CSS Classes:</div>
        <div className="text-xs break-all">{classes.container}</div>
      </div>
    </div>
  );
};

export default ResponsiveDebug;