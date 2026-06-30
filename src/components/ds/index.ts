/* 디자인 시스템 컴포넌트 배럴.
 *
 * vendor/* 는 디자인 시스템 번들에서 추출한 컴포넌트(.jsx, 무타입)다.
 * 기본값에서 좁게 추론되는 prop 타입 충돌을 피하려고 여기서 느슨한
 * 컴포넌트 타입(FC<any>)으로 재노출한다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from "react";
import { Avatar as _Avatar } from "./vendor/core/Avatar";
import { Badge as _Badge } from "./vendor/core/Badge";
import { Button as _Button } from "./vendor/core/Button";
import { Panel as _Panel } from "./vendor/core/Panel";
import { PointTag as _PointTag } from "./vendor/core/PointTag";
import { EmptyState as _EmptyState } from "./vendor/data/EmptyState";
import { KpiStat as _KpiStat } from "./vendor/data/KpiStat";
import { ListRow as _ListRow } from "./vendor/data/ListRow";
import { Field as _Field } from "./vendor/forms/Field";
import { SearchBar as _SearchBar } from "./vendor/forms/SearchBar";
import { Textarea as _Textarea } from "./vendor/forms/Textarea";
import { Tabs as _Tabs } from "./vendor/navigation/Tabs";

export const Avatar = _Avatar as unknown as FC<any>;
export const Badge = _Badge as unknown as FC<any>;
export const Button = _Button as unknown as FC<any>;
export const Panel = _Panel as unknown as FC<any>;
export const PointTag = _PointTag as unknown as FC<any>;
export const EmptyState = _EmptyState as unknown as FC<any>;
export const KpiStat = _KpiStat as unknown as FC<any>;
export const ListRow = _ListRow as unknown as FC<any>;
export const Field = _Field as unknown as FC<any>;
export const SearchBar = _SearchBar as unknown as FC<any>;
export const Textarea = _Textarea as unknown as FC<any>;
export const Tabs = _Tabs as unknown as FC<any>;

export { Icon, DiscordIcon } from "./Icon";
export type { IconName } from "./Icon";
