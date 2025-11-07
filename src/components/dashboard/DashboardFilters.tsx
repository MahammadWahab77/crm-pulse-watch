import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, X, ChevronDown } from "lucide-react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useState } from "react";

interface DashboardFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  sources: string[];
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  counselors: Array<{ id: string; name: string }>;
  selectedCounselors: string[];
  onCounselorsChange: (counselors: string[]) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function DashboardFilters({
  dateRange,
  onDateRangeChange,
  sources,
  selectedSources,
  onSourcesChange,
  counselors,
  selectedCounselors,
  onCounselorsChange,
  search,
  onSearchChange,
}: DashboardFiltersProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [counselorOpen, setCounselorOpen] = useState(false);

  const quickFilters = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
  ];

  const handleQuickFilter = (days: number) => {
    onDateRangeChange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  const toggleCounselor = (counselorId: string) => {
    if (selectedCounselors.includes(counselorId)) {
      onCounselorsChange(selectedCounselors.filter((c) => c !== counselorId));
    } else {
      onCounselorsChange([...selectedCounselors, counselorId]);
    }
  };

  const getCounselorName = (id: string) => {
    return counselors.find((c) => c.id === id)?.name || id;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.days}
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(filter.days)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                    {format(dateRange.to, "MMM dd, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM dd, yyyy")
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Source Filter */}
        <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[200px]">
              <span>
                {selectedSources.length > 0
                  ? `${selectedSources.length} sources`
                  : "Select sources"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search sources..." />
              <CommandList>
                <CommandEmpty>No sources found.</CommandEmpty>
                <CommandGroup>
                  {sources.map((source) => (
                    <CommandItem
                      key={source}
                      onSelect={() => toggleSource(source)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source)}
                          onChange={() => toggleSource(source)}
                          className="h-4 w-4"
                        />
                        <span>{source}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Counselor Filter */}
        <Popover open={counselorOpen} onOpenChange={setCounselorOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between min-w-[200px]">
              <span>
                {selectedCounselors.length > 0
                  ? `${selectedCounselors.length} counselors`
                  : "Select counselors"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search counselors..." />
              <CommandList>
                <CommandEmpty>No counselors found.</CommandEmpty>
                <CommandGroup>
                  {counselors.map((counselor) => (
                    <CommandItem
                      key={counselor.id}
                      onSelect={() => toggleCounselor(counselor.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="checkbox"
                          checked={selectedCounselors.includes(counselor.id)}
                          onChange={() => toggleCounselor(counselor.id)}
                          className="h-4 w-4"
                        />
                        <span>{counselor.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Active Filters */}
      {(selectedSources.length > 0 || selectedCounselors.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedSources.map((source) => (
            <Badge key={source} variant="secondary" className="gap-1">
              {source}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleSource(source)}
              />
            </Badge>
          ))}
          {selectedCounselors.map((counselorId) => (
            <Badge key={counselorId} variant="secondary" className="gap-1">
              {getCounselorName(counselorId)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleCounselor(counselorId)}
              />
            </Badge>
          ))}
          {(selectedSources.length > 0 || selectedCounselors.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSourcesChange([]);
                onCounselorsChange([]);
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
