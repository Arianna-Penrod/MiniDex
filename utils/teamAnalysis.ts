export const STAT_NAMES = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;
export const STAT_LABELS = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
export const BATTLE_TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

type Named = { name: string };
export type TypeRelations = {
  double_damage_from: Named[];
  half_damage_from: Named[];
  no_damage_from: Named[];
  double_damage_to: Named[];
};
export type TeamMember = {
  id: number;
  name: string;
  sprite: string | null;
  types: string[];
  stats: number[];
  relations: TypeRelations[];
};

// Multiply both defensive types: a resistance can cancel a weakness,
// and an immunity always overrides the other type's multiplier.
export function damageMultiplier(member: TeamMember, attackType: string) {
  return member.relations.reduce((damage, relation) => {
    const contains = (items: Named[]) => items.some(item => item.name === attackType);
    if (contains(relation.no_damage_from)) return 0;
    if (contains(relation.double_damage_from)) return damage * 2;
    if (contains(relation.half_damage_from)) return damage / 2;
    return damage;
  }, 1);
}

export function analyzeTeam(team: TeamMember[]) {
  const averages = STAT_NAMES.map((_, i) => team.length
    ? Math.round(team.reduce((sum, member) => sum + member.stats[i], 0) / team.length) : 0);
  const matchups = BATTLE_TYPES.map(type => ({
    type,
    weak: team.filter(member => damageMultiplier(member, type) > 1),
    resists: team.filter(member => damageMultiplier(member, type) < 1),
  }));
  const coverage = new Set(team.flatMap(member => member.relations.flatMap(relation => relation.double_damage_to.map(type => type.name))));
  const shared = matchups.filter(row => row.weak.length >= 2);
  const unprotected = matchups.filter(row => row.weak.length > 0 && row.resists.length === 0);
  const physical = team.filter(member => member.stats[1] > member.stats[3]).length;
  const special = team.filter(member => member.stats[3] > member.stats[1]).length;
  return { averages, matchups, coverage, shared, unprotected, physical, special };
}
