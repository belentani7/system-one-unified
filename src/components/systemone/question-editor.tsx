"use client";

import { Trash2, Plus, GripVertical } from "lucide-react";
import {
  type Question,
  type PrimitiveType,
  PRIMITIVE_TYPES,
} from "@/lib/systemone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PrimitiveIcon } from "./primitive-icon";
import { cn } from "@/lib/utils";

export interface QuestionsMap {
  [key: string]: Question;
}

interface QuestionEditorProps {
  questions: QuestionsMap;
  onChange: (next: QuestionsMap) => void;
  className?: string;
}

/**
 * QuestionEditor — editor visual del esquema de preguntas.
 * Permite añadir / editar / eliminar preguntas de tipo choice / noul / score.
 */
export function QuestionEditor({
  questions,
  onChange,
  className,
}: QuestionEditorProps) {
  const update = (key: string, next: Question) => {
    onChange({ ...questions, [key]: next });
  };
  const remove = (key: string) => {
    const next = { ...questions };
    delete next[key];
    onChange(next);
  };
  const add = (type: PrimitiveType) => {
    // generar key único
    let i = 1;
    let key = `${type}_${i}`;
    while (questions[key]) {
      i++;
      key = `${type}_${i}`;
    }
    let q: Question;
    if (type === "choice") {
      q = {
        type: "choice",
        instructions: "New choice question",
        criteria: { option_a: "Option A description", option_b: "Option B description" },
      };
    } else if (type === "noul") {
      q = { type: "noul", instructions: "New noul statement to verify" };
    } else {
      q = {
        type: "score",
        instructions: "New score question",
        criteria: ["Low", "Medium", "High"],
      };
    }
    onChange({ ...questions, [key]: q });
  };

  const renameKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || !newKey) return;
    if (questions[newKey]) return;
    const next: QuestionsMap = {};
    for (const [k, v] of Object.entries(questions)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(questions).map(([key, q]) => (
        <QuestionRow
          key={key}
          qKey={key}
          question={q}
          onRename={(nk) => renameKey(key, nk)}
          onUpdate={(next) => update(key, next)}
          onRemove={() => remove(key)}
        />
      ))}

      <div className="flex items-center gap-2 pt-2 border-t">
        <span className="text-xs text-muted-foreground">Add:</span>
        {PRIMITIVE_TYPES.map((t) => (
          <Button
            key={t}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(t)}
            className="gap-1.5 h-8 text-xs"
          >
            <PrimitiveIcon type={t} />
            {t}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Fila de pregunta ---------- */

function QuestionRow({
  qKey,
  question,
  onRename,
  onUpdate,
  onRemove,
}: {
  qKey: string;
  question: Question;
  onRename: (nk: string) => void;
  onUpdate: (next: Question) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <PrimitiveIcon type={question.type} withLabel />
        <Input
          value={qKey}
          onChange={(e) => onRename(e.target.value)}
          className="h-7 font-mono text-xs max-w-[40%]"
          aria-label="Question key"
        />
        <div className="ml-auto" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-rose-500"
          onClick={onRemove}
          aria-label="Remove question"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Instructions
        </Label>
        <Input
          value={question.instructions}
          onChange={(e) => onUpdate({ ...question, instructions: e.target.value } as Question)}
          className="h-8 text-xs"
        />
      </div>

      {question.type === "choice" && (
        <ChoiceCriteriaEditor
          criteria={question.criteria}
          onChange={(criteria) => onUpdate({ ...question, criteria })}
        />
      )}

      {question.type === "score" && (
        <ScoreCriteriaEditor
          criteria={question.criteria}
          onChange={(criteria) => onUpdate({ ...question, criteria })}
        />
      )}
    </div>
  );
}

function ChoiceCriteriaEditor({
  criteria,
  onChange,
}: {
  criteria: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const entries = Object.entries(criteria);
  const update = (oldKey: string, newKey: string, newDesc: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (k === oldKey) {
        next[newKey || oldKey] = newDesc;
      } else {
        next[k] = v;
      }
    }
    onChange(next);
  };
  const add = () => {
    let i = 1;
    let key = `option_${i}`;
    while (criteria[key]) {
      i++;
      key = `option_${i}`;
    }
    onChange({ ...criteria, [key]: "New option description" });
  };
  const remove = (key: string) => {
    const next = { ...criteria };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Criteria (option → description)
      </Label>
      <div className="space-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-1.5">
            <Input
              value={k}
              onChange={(e) => update(k, e.target.value, v)}
              className="h-7 font-mono text-[11px] w-1/3"
              aria-label="Option key"
            />
            <Input
              value={v}
              onChange={(e) => update(k, k, e.target.value)}
              className="h-7 text-xs flex-1"
              aria-label="Option description"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
              onClick={() => remove(k)}
              aria-label="Remove option"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className="h-7 text-xs gap-1.5"
      >
        <Plus className="w-3 h-3" />
        Add option
      </Button>
    </div>
  );
}

function ScoreCriteriaEditor({
  criteria,
  onChange,
}: {
  criteria: string[];
  onChange: (next: string[]) => void;
}) {
  const update = (i: number, v: string) => {
    const next = [...criteria];
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...criteria, `Level ${criteria.length}`]);
  const remove = (i: number) => {
    if (criteria.length <= 2) return;
    onChange(criteria.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Scale (ordered levels, ≥ 2)
      </Label>
      <div className="space-y-1.5">
        {criteria.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-muted-foreground w-5 text-right">
              {i}
            </span>
            <Input
              value={label}
              onChange={(e) => update(i, e.target.value)}
              className="h-7 text-xs flex-1"
              aria-label={`Level ${i}`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-rose-500 shrink-0"
              onClick={() => remove(i)}
              disabled={criteria.length <= 2}
              aria-label="Remove level"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className="h-7 text-xs gap-1.5"
      >
        <Plus className="w-3 h-3" />
        Add level
      </Button>
    </div>
  );
}
