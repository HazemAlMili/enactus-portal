import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Departments Loading Skeleton - Shows instantly for Speed Index < 1s
 */
export default function DepartmentsLoading() {
  // Simulate 3 departments with 4 members each
  const departments = ['IT', 'HR', 'PM'];
  const membersPerDept = 4;

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border-b-4 border-b-primary pixel-corners">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl text-white pixel-font text-glow">GUILD HALL</h2>
          <p className="text-gray-400 font-mono text-xs mt-2">VIEW ACTIVE AGENTS AND STATS</p>
        </div>
        
        {/* Dropdown Skeleton */}
        <div className="w-full md:w-48 shrink-0">
          <div className="h-10 bg-background/50 border border-secondary pixel-corners animate-pulse" />
        </div>
      </div>

      {/* Departments Skeleton */}
      <div className="space-y-8 pb-8">
        {departments.map((dept) => (
          <div key={dept} className="space-y-4">
            {/* Department Header Skeleton */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge className="bg-accent/50 text-white pixel-font pixel-corners text-lg px-4 py-1 whitespace-nowrap animate-pulse">
                {dept} GUILD
              </Badge>
              <div className="h-1 bg-white/20 flex-1 pixel-corners min-w-[50px]" />
            </div>

            {/* Members Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(membersPerDept)].map((_, idx) => (
                <Card key={idx} className="bg-card border-2 border-white/10 pixel-corners min-w-0">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      {/* Name Skeleton */}
                      <div className="h-4 w-24 bg-white/20 pixel-corners animate-pulse" />
                      {/* Role Skeleton */}
                      <div className="h-3 w-12 bg-white/10 pixel-corners animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-1">
                      <span className="text-xs text-secondary font-mono">HOURS:</span>
                      {/* Hours Skeleton */}
                      <div className="h-6 w-8 bg-primary/30 pixel-corners animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Loading message */}
      <div className="text-center">
        <p className="text-white/40 pixel-font text-xs animate-pulse">
          LOADING GUILD DATA...
        </p>
      </div>
    </div>
  );
}
