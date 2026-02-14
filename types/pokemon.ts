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
