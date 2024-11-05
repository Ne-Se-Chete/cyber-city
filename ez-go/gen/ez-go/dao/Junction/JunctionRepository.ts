import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface JunctionEntity {
    readonly Id: number;
    Name?: string;
}

export interface JunctionCreateEntity {
    readonly Name?: string;
}

export interface JunctionUpdateEntity extends JunctionCreateEntity {
    readonly Id: number;
}

export interface JunctionEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof JunctionEntity)[],
    $sort?: string | (keyof JunctionEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface JunctionEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<JunctionEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface JunctionUpdateEntityEvent extends JunctionEntityEvent {
    readonly previousEntity: JunctionEntity;
}

export class JunctionRepository {

    private static readonly DEFINITION = {
        table: "JUNCTION",
        properties: [
            {
                name: "Id",
                column: "JUNCTION_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "JUNCTION_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(JunctionRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: JunctionEntityOptions): JunctionEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): JunctionEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: JunctionCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "JUNCTION",
            entity: entity,
            key: {
                name: "Id",
                column: "JUNCTION_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: JunctionUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "JUNCTION",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "JUNCTION_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: JunctionCreateEntity | JunctionUpdateEntity): number {
        const id = (entity as JunctionUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as JunctionUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "JUNCTION",
            entity: entity,
            key: {
                name: "Id",
                column: "JUNCTION_ID",
                value: id
            }
        });
    }

    public count(options?: JunctionEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "JUNCTION"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: JunctionEntityEvent | JunctionUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("ez-go-Junction-Junction", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("ez-go-Junction-Junction").send(JSON.stringify(data));
    }
}
