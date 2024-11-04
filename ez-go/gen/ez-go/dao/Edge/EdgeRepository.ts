import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface EdgeEntity {
    readonly Id: number;
    Weight?: number;
    Junction1?: number;
    Junction2?: number;
}

export interface EdgeCreateEntity {
    readonly Weight?: number;
    readonly Junction1?: number;
    readonly Junction2?: number;
}

export interface EdgeUpdateEntity extends EdgeCreateEntity {
    readonly Id: number;
}

export interface EdgeEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Weight?: number | number[];
            Junction1?: number | number[];
            Junction2?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Weight?: number | number[];
            Junction1?: number | number[];
            Junction2?: number | number[];
        };
        contains?: {
            Id?: number;
            Weight?: number;
            Junction1?: number;
            Junction2?: number;
        };
        greaterThan?: {
            Id?: number;
            Weight?: number;
            Junction1?: number;
            Junction2?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Weight?: number;
            Junction1?: number;
            Junction2?: number;
        };
        lessThan?: {
            Id?: number;
            Weight?: number;
            Junction1?: number;
            Junction2?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Weight?: number;
            Junction1?: number;
            Junction2?: number;
        };
    },
    $select?: (keyof EdgeEntity)[],
    $sort?: string | (keyof EdgeEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface EdgeEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<EdgeEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface EdgeUpdateEntityEvent extends EdgeEntityEvent {
    readonly previousEntity: EdgeEntity;
}

export class EdgeRepository {

    private static readonly DEFINITION = {
        table: "EDGE",
        properties: [
            {
                name: "Id",
                column: "EDGE_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Weight",
                column: "EDGE_WEIGHT",
                type: "DOUBLE",
            },
            {
                name: "Junction1",
                column: "EDGE_JUNCTION1",
                type: "INTEGER",
            },
            {
                name: "Junction2",
                column: "EDGE_JUNCTION2",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(EdgeRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: EdgeEntityOptions): EdgeEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): EdgeEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: EdgeCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "EDGE",
            entity: entity,
            key: {
                name: "Id",
                column: "EDGE_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: EdgeUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "EDGE",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "EDGE_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: EdgeCreateEntity | EdgeUpdateEntity): number {
        const id = (entity as EdgeUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as EdgeUpdateEntity);
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
            table: "EDGE",
            entity: entity,
            key: {
                name: "Id",
                column: "EDGE_ID",
                value: id
            }
        });
    }

    public count(options?: EdgeEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "EDGE"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: EdgeEntityEvent | EdgeUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("ez-go-Edge-Edge", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("ez-go-Edge-Edge").send(JSON.stringify(data));
    }
}
