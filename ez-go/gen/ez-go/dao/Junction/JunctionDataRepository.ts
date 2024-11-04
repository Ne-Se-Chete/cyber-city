import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface JunctionDataEntity {
    readonly Id: number;
    IsRaining?: boolean;
    Property3?: string;
    Junction?: number;
    Timestamp?: Date;
    IsFallen?: boolean;
    IsNoisy?: boolean;
    IsAmbulancePassing?: boolean;
}

export interface JunctionDataCreateEntity {
    readonly IsRaining?: boolean;
    readonly Property3?: string;
    readonly Junction?: number;
    readonly Timestamp?: Date;
    readonly IsFallen?: boolean;
    readonly IsNoisy?: boolean;
    readonly IsAmbulancePassing?: boolean;
}

export interface JunctionDataUpdateEntity extends JunctionDataCreateEntity {
    readonly Id: number;
}

export interface JunctionDataEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            IsRaining?: boolean | boolean[];
            Property3?: string | string[];
            Junction?: number | number[];
            Timestamp?: Date | Date[];
            IsFallen?: boolean | boolean[];
            IsNoisy?: boolean | boolean[];
            IsAmbulancePassing?: boolean | boolean[];
        };
        notEquals?: {
            Id?: number | number[];
            IsRaining?: boolean | boolean[];
            Property3?: string | string[];
            Junction?: number | number[];
            Timestamp?: Date | Date[];
            IsFallen?: boolean | boolean[];
            IsNoisy?: boolean | boolean[];
            IsAmbulancePassing?: boolean | boolean[];
        };
        contains?: {
            Id?: number;
            IsRaining?: boolean;
            Property3?: string;
            Junction?: number;
            Timestamp?: Date;
            IsFallen?: boolean;
            IsNoisy?: boolean;
            IsAmbulancePassing?: boolean;
        };
        greaterThan?: {
            Id?: number;
            IsRaining?: boolean;
            Property3?: string;
            Junction?: number;
            Timestamp?: Date;
            IsFallen?: boolean;
            IsNoisy?: boolean;
            IsAmbulancePassing?: boolean;
        };
        greaterThanOrEqual?: {
            Id?: number;
            IsRaining?: boolean;
            Property3?: string;
            Junction?: number;
            Timestamp?: Date;
            IsFallen?: boolean;
            IsNoisy?: boolean;
            IsAmbulancePassing?: boolean;
        };
        lessThan?: {
            Id?: number;
            IsRaining?: boolean;
            Property3?: string;
            Junction?: number;
            Timestamp?: Date;
            IsFallen?: boolean;
            IsNoisy?: boolean;
            IsAmbulancePassing?: boolean;
        };
        lessThanOrEqual?: {
            Id?: number;
            IsRaining?: boolean;
            Property3?: string;
            Junction?: number;
            Timestamp?: Date;
            IsFallen?: boolean;
            IsNoisy?: boolean;
            IsAmbulancePassing?: boolean;
        };
    },
    $select?: (keyof JunctionDataEntity)[],
    $sort?: string | (keyof JunctionDataEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface JunctionDataEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<JunctionDataEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface JunctionDataUpdateEntityEvent extends JunctionDataEntityEvent {
    readonly previousEntity: JunctionDataEntity;
}

export class JunctionDataRepository {

    private static readonly DEFINITION = {
        table: "JUNCTIONDATA",
        properties: [
            {
                name: "Id",
                column: "JUNCTIONDATA_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "IsRaining",
                column: "JUNCTIONDATA_ISRAINING",
                type: "BOOLEAN",
            },
            {
                name: "Property3",
                column: "JUNCTIONDATA_PROPERTY3",
                type: "VARCHAR",
            },
            {
                name: "Junction",
                column: "JUNCTIONDATA_JUNCTION",
                type: "INTEGER",
            },
            {
                name: "Timestamp",
                column: "JUNCTIONDATA_TIMESTAMP",
                type: "TIMESTAMP",
            },
            {
                name: "IsFallen",
                column: "JUNCTIONDATA_ISFALLEN",
                type: "BOOLEAN",
            },
            {
                name: "IsNoisy",
                column: "JUNCTIONDATA_ISNOISY",
                type: "BOOLEAN",
            },
            {
                name: "IsAmbulancePassing",
                column: "JUNCTIONDATA_ISAMBULANCEPASSING",
                type: "BOOLEAN",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(JunctionDataRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: JunctionDataEntityOptions): JunctionDataEntity[] {
        return this.dao.list(options).map((e: JunctionDataEntity) => {
            EntityUtils.setBoolean(e, "IsRaining");
            EntityUtils.setBoolean(e, "IsFallen");
            EntityUtils.setBoolean(e, "IsNoisy");
            EntityUtils.setBoolean(e, "IsAmbulancePassing");
            return e;
        });
    }

    public findById(id: number): JunctionDataEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setBoolean(entity, "IsRaining");
        EntityUtils.setBoolean(entity, "IsFallen");
        EntityUtils.setBoolean(entity, "IsNoisy");
        EntityUtils.setBoolean(entity, "IsAmbulancePassing");
        return entity ?? undefined;
    }

    public create(entity: JunctionDataCreateEntity): number {
        EntityUtils.setBoolean(entity, "IsRaining");
        EntityUtils.setBoolean(entity, "IsFallen");
        EntityUtils.setBoolean(entity, "IsNoisy");
        EntityUtils.setBoolean(entity, "IsAmbulancePassing");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "JUNCTIONDATA",
            entity: entity,
            key: {
                name: "Id",
                column: "JUNCTIONDATA_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: JunctionDataUpdateEntity): void {
        EntityUtils.setBoolean(entity, "IsRaining");
        EntityUtils.setBoolean(entity, "IsFallen");
        EntityUtils.setBoolean(entity, "IsNoisy");
        EntityUtils.setBoolean(entity, "IsAmbulancePassing");
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "JUNCTIONDATA",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "JUNCTIONDATA_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: JunctionDataCreateEntity | JunctionDataUpdateEntity): number {
        const id = (entity as JunctionDataUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as JunctionDataUpdateEntity);
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
            table: "JUNCTIONDATA",
            entity: entity,
            key: {
                name: "Id",
                column: "JUNCTIONDATA_ID",
                value: id
            }
        });
    }

    public count(options?: JunctionDataEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "JUNCTIONDATA"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: JunctionDataEntityEvent | JunctionDataUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("ez-go-Junction-JunctionData", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("ez-go-Junction-JunctionData").send(JSON.stringify(data));
    }
}
