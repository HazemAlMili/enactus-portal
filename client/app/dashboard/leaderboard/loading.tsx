import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from 'lucide-react';

/**
 * Loading skeleton - EXACT structural clone of page.tsx for seamless transition!
 */
export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header - EXACT same structure as page.tsx */}
      <div className="flex items-center gap-3 mb-6 bg-card p-6 border-b-4 border-b-secondary pixel-corners">
        <div className="w-8 h-8 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-secondary animate-pulse" />
        </div>
        <h2 className="text-3xl pixel-font text-white">LEADERBOARD</h2>
        <div className="ml-auto text-sm text-white/60 pixel-font opacity-50">TOP--</div>
      </div>

      {/* Table - EXACT same structure and widths as page.tsx */}
      <Card className="bg-card border-2 border-primary pixel-corners">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            {/* ⚡ table-fixed + EXACT same widths as page.tsx */}
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="border-b border-primary/30">
                  {/* EXACT same widths: 10% + 60% + 15% + 15% = 100% */}
                  <TableHead className="text-primary pixel-font text-xs w-[10%]">RANK</TableHead>
                  <TableHead className="text-primary pixel-font text-xs w-[60%]">PLAYER</TableHead>
                  <TableHead className="text-primary pixel-font text-xs w-[15%]">GUILD</TableHead>
                  <TableHead className="text-right text-primary pixel-font text-xs w-[15%]">HOURS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 10 skeleton rows to match backend */}
                {[...Array(10)].map((_, i) => (
                  <TableRow key={i} className="border-b border-primary/10">
                    {/* Rank - 10% width (EXACT same) */}
                    <TableCell className="font-bold text-white pixel-font text-xs w-[10%]">
                      {i < 3 ? (
                        <div className={`flex items-center justify-center w-7 h-7 pixel-corners animate-pulse ${
                          i === 0 ? 'bg-yellow-500/30' : 
                          i === 1 ? 'bg-gray-400/30' : 
                          'bg-amber-700/30'
                        }`} />
                      ) : (
                        <div className="h-4 w-8 bg-gray-500/20 pixel-corners animate-pulse" />
                      )}
                    </TableCell>
                    {/* Player - 60% width (EXACT same) */}
                    <TableCell className="text-white pixel-font text-xs w-[60%]">
                      <div className="h-4 w-32 bg-white/20 pixel-corners animate-pulse" />
                    </TableCell>
                    {/* Guild - 15% width (EXACT same) */}
                    <TableCell className="w-[15%]">
                      <div className="h-6 w-16 bg-accent/20 pixel-corners animate-pulse inline-block" />
                    </TableCell>
                    {/* Hours - 15% width (EXACT same) */}
                    <TableCell className="text-right pixel-font text-secondary text-xs font-bold w-[15%]">
                      <div className="h-4 w-12 bg-secondary/30 pixel-corners animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
