// create a pokemon interface to define the shape of the data we get from the api
export interface Pokemon {
    name: string;
    url: string;
    front?: string | null;
    back?: string | null;
    shinyFront?: string | null;
    shinyBack?: string | null;
    types: string[];
}

export interface PokemonDetails extends Pokemon {
    description: string;
    height: number;
    weight: number;
    abilities: string[];
    stats: {
        hp: number;
        attack: number;
        defense: number;
        specialAttack: number;
        specialDefense: number;
        speed: number;
    };
}